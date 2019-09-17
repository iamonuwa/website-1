import * as React from 'react';
import MediaQuery from 'react-responsive';
import styled from 'styled-components';

import CircularProgress from 'material-ui/CircularProgress';

import { Hero } from 'ts/components/docs/layout/hero';
import { ScrollTopArrow } from 'ts/components/docs/layout/scroll_top_arrow';
import { SiteWrap } from 'ts/components/siteWrap';
import { Header as StakingHeader } from 'ts/components/staking/header/header';

import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { colors } from 'ts/style/colors';

interface IStakingPageLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    keywords?: string;
    subtitle?: string;
    loading?: boolean;
    isHome?: boolean;
}

const SECTION_MIN_HEIGHT = '50vh';
const SECTION_WIDTH = '1150px';

const { description, keywords, title } = documentConstants.STAKING;

export const StakingPageLayout: React.FC<IStakingPageLayoutProps  > = props => {
    return (
        <SiteWrap isDocs={true} theme="light" headerComponent={StakingHeader}>
            <DocumentTitle
                title={props.isHome ? title : `${title}: ${props.title}`}
                description={props.description ? props.description : description}
                keywords={props.keywords ? props.keywords : keywords}
            />

            <Section maxWidth={SECTION_WIDTH} minHeight={SECTION_MIN_HEIGHT} isPadded={false} overflow="visible">
                {props.loading ? (
                    <LoaderWrapper>
                        <CircularProgress size={40} thickness={2} color={colors.brandLight} />
                    </LoaderWrapper>
                ) : (
                    props.children
                )}
            </Section>
        </SiteWrap>
    );
};

const LoaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: ${SECTION_MIN_HEIGHT};
`;
